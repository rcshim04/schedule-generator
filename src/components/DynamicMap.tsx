import { useMemo } from 'preact/hooks';
import winterMap from '../assets/winter_map.png';
import springMap from '../assets/spring_map.png';
import fallMap from '../assets/fall_map.png';
import { BuildingMarker } from '../types';
import { term } from '../util';

interface DynamicMapProps {
    buildingMarkers: BuildingMarker[];
}

export function DynamicMap({ buildingMarkers }: DynamicMapProps) {
    const {
        croppedTop,
        croppedLeft,
        scale,
        containerWidth,
    } = useMemo(() => {
        const topMin = Math.min( ...buildingMarkers.map(b => b.top));
        const topMax = Math.max( ...buildingMarkers.map(b => b.top));
        const leftMin = Math.min( ...buildingMarkers.map(b => b.left));
        const leftMax = Math.max( ...buildingMarkers.map(b => b.left));

        const initialTop = Math.max(0, topMin - 10);
        const initialBottom = Math.min(100, topMax + 10);
        const initialLeft = Math.max(0, leftMin - 10);
        const initialRight = Math.min(100, leftMax + 10);

        const verticalRange = initialBottom - initialTop;
        const horizontalRange = initialRight - initialLeft;

        const imageSize = 1000;
        const baseContainerHeightPx = 320;
        const minContainerWidthPx = 320;
        const maxContainerWidthPx = 640;

        const visibleVerticalPixels = (verticalRange / 100) * 1000;
        const visibleHorizontalPixels = (horizontalRange / 100) * 1000;

        let scale = baseContainerHeightPx / visibleVerticalPixels;
        let containerWidth = visibleHorizontalPixels * scale;
        let containerHeight = baseContainerHeightPx;

        if (containerWidth < minContainerWidthPx) {
            containerWidth = minContainerWidthPx;
        }

        if (containerWidth > maxContainerWidthPx) {
            scale = maxContainerWidthPx / visibleHorizontalPixels;
            containerWidth = maxContainerWidthPx;
        }

        const pixelsPerPercent = (imageSize / 100) * scale;

        const scaledWidth = visibleHorizontalPixels * scale;
        const centerShiftPercentX = (containerWidth - scaledWidth) / (2 * pixelsPerPercent);
        const scaledHorizontalRange = containerWidth / pixelsPerPercent;

        let croppedLeft = initialLeft - centerShiftPercentX;
        const maxLeft = 100 - scaledHorizontalRange;
        croppedLeft = Math.max(0, Math.min(maxLeft, croppedLeft));

        const scaledHeight = visibleVerticalPixels * scale;
        const centerShiftPercentY = (containerHeight - scaledHeight) / (2 * pixelsPerPercent);
        const scaledVerticalRange = containerHeight / pixelsPerPercent;

        let croppedTop = initialTop - centerShiftPercentY;
        const maxTop = 100 - scaledVerticalRange;
        croppedTop = Math.max(0, Math.min(maxTop, croppedTop));

        return {
            croppedTop,
            croppedLeft,
            scale,
            containerWidth,
        };
    }, [buildingMarkers]);

    const containerHeight = 320;
    
    const termSeason = term();

    const campusMaps = {
        'winter': winterMap,
        'spring': springMap,
        'fall': fallMap,
    }

    return (
        <div
            id="schedule-map"
            style={{
                width: `${containerWidth}px`,
                height: `${containerHeight}px`
            }}
        >
            <img 
                src={campusMaps[termSeason]}
                alt="campus map"
                style={{
                    width: `1000px`,
                    height: `1000px`,
                    transform: `
                        translate(-${croppedLeft * 10 * scale}px, -${croppedTop * 10 * scale}px)
                        scale(${scale})
                    `
                }}
            />
            {buildingMarkers.map((marker) => {
                const adjustedTop = (marker.top - croppedTop) * 10 * scale;
                const adjustLeft = (marker.left - croppedLeft) * 10 * scale;;

                return (
                    <div
                        class="building-marker"
                        style={{
                            backgroundColor: marker.color,
                            left: adjustLeft,
                            top: adjustedTop,
                        }}
                        title={marker.code}
                        key={marker.code}
                    >
                        <span
                            style={{
                                color: marker.color,
                            }}
                        >
                            {marker.code.toLowerCase()}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}