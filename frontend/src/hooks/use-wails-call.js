import {useCallback, useEffect, useRef, useState} from 'react';

function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'Unexpected backend request error.';
}

export function useWailsCall(asyncFn, {initialData = null, immediate = false} = {}) {
    const mountedRef = useRef(false);
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);

        try {
            const result = await asyncFn(...args);
            if (mountedRef.current) {
                setData(result);
            }
            return result;
        } catch (err) {
            const message = getErrorMessage(err);
            if (mountedRef.current) {
                setError(message);
            }
            throw err;
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [asyncFn]);

    const reset = useCallback(() => {
        setData(initialData);
        setError(null);
        setLoading(false);
    }, [initialData]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (immediate) {
            execute().catch(() => {});
        }
    }, [execute, immediate]);

    return {data, loading, error, execute, reset};
}
