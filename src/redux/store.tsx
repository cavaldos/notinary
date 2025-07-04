import countSlice from './features/countSlice';

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
    Persistor
} from 'redux-persist';

// Use dynamic import for storage to prevent server-side errors
let storage;
if (typeof window !== 'undefined') {
    storage = require('redux-persist/lib/storage').default;
}

const persistConfig = {
    key: 'root',
    version: 1,
    storage,
    whitelist: ['count'], // You probably want to persist the count slice
};
const rootReducer = combineReducers({
    count: countSlice
});

export type RootState = ReturnType<typeof rootReducer>;

// Create a store with or without persistence based on environment
let store: ReturnType<typeof configureStore> | undefined | any;
let persistor: Persistor | undefined | any;

if (typeof window !== 'undefined') {
    // We're in the browser, use persist
    const persistedReducer = persistReducer(persistConfig, rootReducer);

    store = configureStore({
        reducer: persistedReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
                },
            }),
    });

    persistor = persistStore(store);
} else {
    // We're on the server, don't use persist
    store = configureStore({
        reducer: rootReducer,
    });
}

export type AppDispatch = typeof store.dispatch;
export { persistor };
export default store;