import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSignedUrlOptions {
  bucket: string;
  path: string | null;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}

export function useSignedUrl({ bucket, path, expiresIn = 3600 }: UseSignedUrlOptions) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setSignedUrl(null);
      return;
    }

    // Extract the file path from full URL if needed
    let filePath = path;
    if (path.includes('/storage/v1/object/')) {
      // Extract path after bucket name
      const bucketPattern = new RegExp(`/storage/v1/object/(?:public|sign)?/${bucket}/(.+)`);
      const match = path.match(bucketPattern);
      if (match) {
        filePath = match[1];
      }
    }

    const fetchSignedUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('get-signed-url', {
          body: { bucket, path: filePath, expiresIn }
        });

        if (fnError) {
          console.error('[useSignedUrl] Function error:', fnError);
          setError(fnError.message);
          // Fallback to direct URL for public buckets
          if (['evidencias_agenda', 'eventos_colegio', 'manuais'].includes(bucket)) {
            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
            setSignedUrl(urlData.publicUrl);
          }
          return;
        }

        if (data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        } else {
          setError('Failed to generate signed URL');
        }
      } catch (err: any) {
        console.error('[useSignedUrl] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();

    // Refresh signed URL before expiration (at 80% of expiry time)
    const refreshInterval = setInterval(() => {
      fetchSignedUrl();
    }, expiresIn * 0.8 * 1000);

    return () => clearInterval(refreshInterval);
  }, [bucket, path, expiresIn]);

  return { signedUrl, loading, error };
}

// Utility function to get signed URL directly
export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
  try {
    // Extract file path if full URL
    let filePath = path;
    if (path.includes('/storage/v1/object/')) {
      const bucketPattern = new RegExp(`/storage/v1/object/(?:public|sign)?/${bucket}/(.+)`);
      const match = path.match(bucketPattern);
      if (match) {
        filePath = match[1];
      }
    }

    const { data, error } = await supabase.functions.invoke('get-signed-url', {
      body: { bucket, path: filePath, expiresIn }
    });

    if (error) {
      console.error('[getSignedUrl] Error:', error);
      return null;
    }

    return data?.signedUrl || null;
  } catch (err) {
    console.error('[getSignedUrl] Exception:', err);
    return null;
  }
}
