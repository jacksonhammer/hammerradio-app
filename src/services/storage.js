import * as SecureStore from 'expo-secure-store';

const Storage = {
  getItem:    (key)        => SecureStore.getItemAsync(key),
  setItem:    (key, value) => SecureStore.setItemAsync(key, String(value)),
  removeItem: (key)        => SecureStore.deleteItemAsync(key),
};

export default Storage;
