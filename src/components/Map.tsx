import type { CSSProperties } from "react";

interface LocationMapProps {
    mapUrl: string;
    googleMapLink: string;
    style: CSSProperties
}

const LocationMap = ({
    mapUrl,
    googleMapLink,
    style
}: LocationMapProps) => {
    return (
        <div
            className="border rounded-sm overflow-hidden relative"
            style={{
                background: "#f5f5f5",
                ...style
            }}
        >
            {mapUrl ? (
                <>
                    <iframe
                        title="Company Location"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={mapUrl}
                    />

                    <a
                        href={googleMapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 bg-white px-3 py-1 rounded shadow text-sm text-blue-600 font-medium"
                    >
                        Open Map
                    </a>
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                    Enter address to view map
                </div>
            )}
        </div>
    );
};

export default LocationMap;