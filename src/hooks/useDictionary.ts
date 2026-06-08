import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDictionaryData, setDictionary } from '@/redux/features/dictionarySlice';
import type { AppDispatch, RootState } from '@/redux/store';
import type { DictionaryItem } from '@/redux/features/dictionarySlice';

export const useDictionary = (space?: string) => {
    const dispatch = useDispatch<AppDispatch>();
    const currentSpace = useSelector((state: RootState) => space ?? state.dictionary.currentSpace);
    const spaceState = useSelector((state: RootState) => {
        if (!currentSpace) {
            return undefined;
        }

        return state.dictionary.spaces[currentSpace];
    });

    const fetchData = useCallback(
        async (nextSpace: string) => {
            await dispatch(fetchDictionaryData(nextSpace));
        },
        [dispatch]
    );

    const updateDictionary = useCallback(
        (dictionary: DictionaryItem[], nextSpace = currentSpace) => {
            if (!nextSpace) {
                return;
            }

            dispatch(setDictionary({ space: nextSpace, dictionary }));
        },
        [currentSpace, dispatch]
    );

    return {
        total: spaceState?.total ?? 0,
        setTotal: undefined,
        dictionary: spaceState?.dictionary ?? [],
        setDictionary: updateDictionary,
        fetchData,
        loading: spaceState?.loading ?? false,
        error: spaceState?.error ?? null,
        loaded: spaceState?.loaded ?? false,
    };
};
