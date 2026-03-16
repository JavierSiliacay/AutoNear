'use client';

import { useState, useEffect } from 'react';

export default function TestMapsPage() {
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const testGeocode = async () => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            setError('API Key not found in environment variables.');
            return;
        }

        try {
            // Testing with Manila coordinates
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=14.5995,120.9842&key=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    useEffect(() => {
        testGeocode();
    }, []);

    return (
        <div className="p-10 bg-midnight min-h-screen text-white">
            <h1 className="text-2xl font-bold mb-4">Google Maps API Key Test</h1>
            
            <div className="glass-card p-6 rounded-2xl border border-white/10">
                <h2 className="text-lg font-bold mb-2">Status</h2>
                {error && <p className="text-red-500">Error: {error}</p>}
                {result && (
                    <div className={`p-4 rounded-xl mb-4 ${result.status === 'OK' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        <p className="font-bold">API Status: {result.status}</p>
                        {result.error_message && <p className="text-sm mt-1">{result.error_message}</p>}
                    </div>
                )}

                <h2 className="text-lg font-bold mb-2">Detailed Response</h2>
                <pre className="bg-black/50 p-4 rounded-xl overflow-auto max-h-96 text-xs">
                    {JSON.stringify(result, null, 2)}
                </pre>
            </div>

            <div className="mt-8 text-sm text-muted-foreground">
                <p>If status is <strong>OK</strong>, then the Geocoding API is enabled and working with your key.</p>
                <p>If status is <strong>REQUEST_DENIED</strong>, check the error message above for details.</p>
            </div>
        </div>
    );
}
