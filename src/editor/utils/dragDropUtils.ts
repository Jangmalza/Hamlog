
export type DropSide = 'left' | 'right' | null;

interface ImageDetectionResult {
    targetImage: Element | null;
    dropSide: DropSide;
    parentColumn?: Element | null;
    parentColumns?: Element | null;
}

export const detectImageDropZone = (
    editorDom: HTMLElement,
    clientX: number,
    clientY: number
): ImageDetectionResult => {
    // Improved selector to catch images inside NodeViews (ImageComponent) and standard images
    const images = Array.from(editorDom.querySelectorAll('.image-component img, img.post-image, img[data-type="custom-image"]'));

    let targetImage: Element | null = null;
    let dropSide: DropSide = null;
    let parentColumn: Element | null = null;
    let parentColumns: Element | null = null;

    const SCAN_DISTANCE = 100; // Pixel distance to consider "near"

    // Find the closest image vertically that we are horizontally within range of
    for (const img of images) {
        const rect = img.getBoundingClientRect();
        // Check if Y is within reasonable range (e.g. same line)
        if (clientY >= rect.top && clientY <= rect.bottom) {
            // We are inside the vertical strip of this image.
            // Now check X.
            // We accept drops slightly outside the image too (gaps).
            if (clientX >= rect.left - SCAN_DISTANCE && clientX <= rect.right + SCAN_DISTANCE) {
                // Potential target
                const width = rect.width;
                const offsetX = clientX - rect.left;

                // Define trigger zones
                // 0% - 30%: Left
                // 70% - 100%: Right

                if (offsetX < width * 0.3) {
                    targetImage = img;
                    dropSide = 'left';
                    break;
                } else if (offsetX > width * 0.7) {
                    targetImage = img;
                    dropSide = 'right';
                    break;
                }
            }
        }
    }

    if (targetImage) {
        // Detect if inside a column
        const imageComponent = targetImage.closest('.image-component');
        const leafNode = imageComponent || targetImage;
        parentColumn = leafNode.closest('[data-type="column"]');
        parentColumns = leafNode.closest('[data-type="columns"]');
    }

    return { targetImage, dropSide, parentColumn, parentColumns };
};
