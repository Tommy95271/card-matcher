import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';

// 預設 Firebase 設定 (透過 Vite 環境變數注入)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || ''
};

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.currentUser = null;
    this.authListeners = [];
    this.unsubscribeExpenses = null;

    this.init();
  }

  getSavedConfig() {
    try {
      const custom = localStorage.getItem('card_matcher_firebase_config_v1');
      if (custom) return JSON.parse(custom);
    } catch (e) {
      console.warn('無法讀取自訂 Firebase 設定', e);
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  saveConfig(config) {
    try {
      localStorage.setItem('card_matcher_firebase_config_v1', JSON.stringify(config));
      this.init(config);
    } catch (e) {
      console.error('儲存 Firebase 設定失敗', e);
    }
  }

  isConfigured() {
    const cfg = this.getSavedConfig();
    return !!(cfg && cfg.apiKey && cfg.projectId);
  }

  init(customConfig = null) {
    const config = customConfig || this.getSavedConfig();
    if (!config || !config.apiKey || !config.projectId) {
      return false;
    }

    try {
      if (!getApps().length) {
        this.app = initializeApp(config);
      } else {
        this.app = getApps()[0];
      }
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);

      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        this.authListeners.forEach((cb) => cb(user));
      });

      return true;
    } catch (err) {
      console.warn('Firebase 初始化失敗:', err);
      return false;
    }
  }

  onAuthChange(callback) {
    this.authListeners.push(callback);
    if (this.currentUser !== null || (this.auth && this.auth.currentUser)) {
      callback(this.currentUser || this.auth.currentUser);
    }
  }

  async signInWithGoogle() {
    if (!this.isConfigured()) {
      throw new Error('請先在設定中配置 Firebase 專案金鑰！');
    }
    if (!this.auth) this.init();

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(this.auth, provider);
    this.currentUser = result.user;
    return result.user;
  }

  async logout() {
    if (this.unsubscribeExpenses) {
      this.unsubscribeExpenses();
      this.unsubscribeExpenses = null;
    }
    if (this.auth) {
      await signOut(this.auth);
    }
    this.currentUser = null;
  }

  // ==========================================
  // Firestore 雲端資料庫操作 (users/{uid}/expenses)
  // ==========================================

  getUserExpensesRef(uid) {
    if (!this.db) return null;
    return collection(this.db, 'users', uid, 'expenses');
  }

  /**
   * 即時雙向監聽該使用者的雲端消費帳本
   */
  subscribeUserExpenses(uid, onUpdate, onError) {
    if (!this.db || !uid) return () => {};

    if (this.unsubscribeExpenses) {
      this.unsubscribeExpenses();
    }

    const expensesRef = this.getUserExpensesRef(uid);
    const q = query(expensesRef, orderBy('date', 'desc'));

    this.unsubscribeExpenses = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        onUpdate(list);
      },
      (error) => {
        console.error('Firestore 即時同步錯誤:', error);
        if (onError) onError(error);
      }
    );

    return this.unsubscribeExpenses;
  }

  /**
   * 寫入或更新單筆消費紀錄至 Firestore
   */
  async saveExpense(uid, expense) {
    if (!this.db || !uid) return;
    const docRef = doc(this.db, 'users', uid, 'expenses', expense.id);
    await setDoc(docRef, {
      ...expense,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  /**
   * 更新消費紀錄狀態 (已入帳 / 漏給)
   */
  async updateExpenseStatus(uid, expenseId, status, actualPoints) {
    if (!this.db || !uid) return;
    const docRef = doc(this.db, 'users', uid, 'expenses', expenseId);
    const updateData = { status, updatedAt: new Date().toISOString() };
    if (actualPoints !== null && actualPoints !== undefined) {
      updateData.actualPoints = Number(actualPoints);
    }
    await updateDoc(docRef, updateData);
  }

  /**
   * 刪除消費紀錄
   */
  async deleteExpense(uid, expenseId) {
    if (!this.db || !uid) return;
    const docRef = doc(this.db, 'users', uid, 'expenses', expenseId);
    await deleteDoc(docRef);
  }

  /**
   * 批次將本機未登入前的消費記錄遷移上傳至雲端
   */
  async batchMigrateLocalExpenses(uid, localExpenses) {
    if (!this.db || !uid || !localExpenses || !localExpenses.length) return;
    const batch = writeBatch(this.db);

    localExpenses.forEach((exp) => {
      const docRef = doc(this.db, 'users', uid, 'expenses', exp.id);
      batch.set(docRef, {
        ...exp,
        cloudSynced: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    await batch.commit();
  }
}

export const firebaseService = new FirebaseService();
