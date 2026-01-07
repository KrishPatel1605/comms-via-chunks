const DB_NAME = "ConstructionAuthDB";
const DB_VERSION = 1;
const STORE_NAME = "users";

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "employeeId",
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Error opening DB");
  });
};


export const addUser = async (user) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const request = store.add(user);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject("User already exists");
  });
};


export const getUser = async (employeeId) => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.get(employeeId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
};
