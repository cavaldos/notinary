export const normalizeTypeTags = (type: unknown): string[] => {
    if (Array.isArray(type)) {
        return type.filter((value): value is string => typeof value === 'string' && value.trim() !== '');
    }

    if (typeof type === 'string' && type.trim() !== '') {
        return [type];
    }

    return [];
};

export const formatTypeTags = (type: unknown): string => normalizeTypeTags(type).join(', ');

export const hasTypeTag = (type: unknown, tag: string): boolean => normalizeTypeTags(type).includes(tag);
