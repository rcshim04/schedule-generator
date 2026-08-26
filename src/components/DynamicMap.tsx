import { useMemo } from 'preact/hooks';
import winterMap from '../assets/winter_map.png';
import springMap from '../assets/spring_map.png';
import fallMap from '../assets/fall_map.png';
import { BuildingMarker } from '../types';
import { term } from '../util';

interface DynamicMapProps {
    buildingMarkers: BuildingMarker[];
}

interface LabelPlacement {
    left: number;
    top: number;
}

interface Rectangle extends LabelPlacement {
    width: number;
    height: number;
}

const LABEL_HEIGHT = 24;
const LABEL_GAP = 2;
const PIN_RADIUS = 11;
const labelWidthCache = new Map<string, number>();

const labelWidth = (code: string) => {
    const cachedWidth = labelWidthCache.get(code);
    if (cachedWidth) return cachedWidth;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context!.font = '600 18px Poppins';
    const width = Math.ceil(context!.measureText(code.toLowerCase()).width);
    labelWidthCache.set(code, width);
    return width;
};

const readableLabelColor = (hexColor: string) => {
    const channels = hexColor
        .replace('#', '')
        .match(/.{2}/g)
        ?.map(channel => Number.parseInt(channel, 16));

    if (!channels || channels.some(Number.isNaN)) return '#263238';

    // Keep the assigned hue recognizable, but blend it toward a dark neutral so
    // even the pale building colors remain legible on the light campus maps.
    const darkNeutral = [25, 32, 38];
    const darkened = channels.map((channel, index) =>
        Math.round(channel * 0.55 + darkNeutral[index] * 0.45),
    );

    return `rgb(${darkened.join(', ')})`;
};

const overlapArea = (first: Rectangle, second: Rectangle) => {
    const width = Math.max(0, Math.min(first.left + first.width, second.left + second.width) - Math.max(first.left, second.left));
    const height = Math.max(0, Math.min(first.top + first.height, second.top + second.height) - Math.max(first.top, second.top));
    return width * height;
};

const labelPositionCandidates = (x: number, y: number, width: number): LabelPlacement[] => {
    const radius = PIN_RADIUS + LABEL_GAP + Math.max(width / 2, LABEL_HEIGHT / 2);
    const rotation = 15 * Math.PI / 180;
    const directions = Array.from({ length: 8 }, (_, index) => {
        const angle = rotation + index * Math.PI / 4;
        return { x: Math.cos(angle), y: Math.sin(angle) };
    });

    return directions.map(direction => ({
        left: x + direction.x * radius - width / 2,
        top: y + direction.y * radius - LABEL_HEIGHT / 2,
    }));
};

const labelPlacements = (
    markers: BuildingMarker[],
    croppedTop: number,
    croppedLeft: number,
    scale: number,
    containerWidth: number,
    containerHeight: number,
) => {
    const pins = markers.map(marker => ({
        marker,
        x: (marker.left - croppedLeft) * 10 * scale,
        y: (marker.top - croppedTop) * 10 * scale,
    }));

    // Lay out the most crowded pins first, while the most label positions are available.
    const orderedPins = [...pins].sort((first, second) => {
        const nearestDistance = (pin: typeof first) => Math.min(
            ...pins
                .filter(other => other.marker.code !== pin.marker.code)
                .map(other => Math.hypot(pin.x - other.x, pin.y - other.y)),
        );
        return nearestDistance(first) - nearestDistance(second);
    });

    const placedLabels: Rectangle[] = [];
    const placements = new Map<BuildingMarker['code'], LabelPlacement>();

    orderedPins.forEach(({ marker, x, y }) => {
        const width = labelWidth(marker.code);
        const candidates = labelPositionCandidates(x, y, width);

        const best = candidates.reduce((currentBest, candidate, preference) => {
            const rectangle = { ...candidate, width, height: LABEL_HEIGHT };
            const outsideWidth = Math.max(0, -rectangle.left) + Math.max(0, rectangle.left + width - containerWidth);
            const outsideHeight = Math.max(0, -rectangle.top) + Math.max(0, rectangle.top + LABEL_HEIGHT - containerHeight);
            const labelOverlap = placedLabels.reduce((sum, placed) => sum + overlapArea(rectangle, placed), 0);
            const pinOverlap = pins.reduce((sum, pin) => sum + overlapArea(rectangle, {
                left: pin.x - PIN_RADIUS,
                top: pin.y - PIN_RADIUS,
                width: PIN_RADIUS * 2,
                height: PIN_RADIUS * 2,
            }), 0);
            const score = (outsideWidth + outsideHeight) * 1000 + labelOverlap * 100 + pinOverlap * 10 + preference;

            return score < currentBest.score ? { rectangle, score } : currentBest;
        }, { rectangle: { ...candidates[0], width, height: LABEL_HEIGHT }, score: Number.POSITIVE_INFINITY });

        placedLabels.push(best.rectangle);
        placements.set(marker.code, { left: best.rectangle.left - x, top: best.rectangle.top - y });
    });

    return placements;
};

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
    const labels = useMemo(
        () => labelPlacements(buildingMarkers, croppedTop, croppedLeft, scale, containerWidth, containerHeight),
        [buildingMarkers, croppedTop, croppedLeft, scale, containerWidth],
    );
    
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
                const adjustedLeft = (marker.left - croppedLeft) * 10 * scale;
                const selectedLabel = labels.get(marker.code);

                return (
                    <div class="building-marker-group" key={marker.code}>
                        <div
                            class="building-marker"
                            style={{
                                backgroundColor: marker.color,
                                left: adjustedLeft,
                                top: adjustedTop,
                            }}
                            title={marker.code}
                        />
                        <span
                            class="building-label"
                            style={{
                                color: readableLabelColor(marker.color),
                                left: adjustedLeft + (selectedLabel?.left ?? 0),
                                top: adjustedTop + (selectedLabel?.top ?? 0),
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
