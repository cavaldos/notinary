import { useState, useCallback } from 'react';
import NotionService from '@/services/notion.service';

export const useDictionary = () => {
    const [total, setTotal] = useState(0);
    const [dictionary, setDictionary] = useState([] as any[]);

    const fetchData = useCallback(async (space: string) => {
        try {
            const response: any = await NotionService.en.getSpacedTimeItems(200, space);
            if (response && response.data && Array.isArray(response.data)) {
                const filteredData = response.data.filter(
                    (item: any) => item.Word !== null && item.Word.trim() !== ''
                );
                setTotal(response.data.length);
                setDictionary(filteredData || []);
            } else {
                setTotal(0);
                setDictionary([]);
            }
        } catch (error) {
            console.error('Error fetching vocabulary:', error);
            setTotal(0);
            setDictionary([]);
        }
    }, []);

    return {
        total,
        setTotal,
        dictionary,
        setDictionary,
        fetchData
    };
};
