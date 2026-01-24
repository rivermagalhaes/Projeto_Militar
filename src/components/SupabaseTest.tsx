import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const SupabaseTest = () => {
    const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const { error } = await supabase.from('test_connection').select('*').limit(1);

                // If the table doesn't exist, we'll get a specific error, but that means we ARE connected.
                // If the URL/Key is wrong, we'll get a network or auth error.

                // A generic check is simply initializing and listing tables or checking auth session.
                // Let's try a simple health check by seeing if we can interact with auth.
                const { error: authError } = await supabase.auth.getSession();

                if (authError) {
                    throw authError;
                }

                setStatus('connected');
            } catch (err: any) {
                setStatus('error');
                setErrorMessage(err.message || 'Failed to connect');
                console.error('Supabase connection error:', err);
            }
        };

        checkConnection();
    }, []);

    return (
        <div className="p-4 m-4 border rounded shadow-md bg-white">
            <h2 className="text-lg font-bold mb-2">Supabase Status</h2>
            {status === 'loading' && <p className="text-blue-500">Checking connection...</p>}
            {status === 'connected' && <p className="text-green-600 font-semibold">✅ Connected successfully!</p>}
            {status === 'error' && (
                <div>
                    <p className="text-red-600 font-semibold">❌ Connection failed</p>
                    <p className="text-sm text-gray-600 font-mono mt-1">{errorMessage}</p>
                </div>
            )}
        </div>
    );
};
