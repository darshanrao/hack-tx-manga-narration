"use client";

import * as AspectRatioPrimitive from " $matches[0] -replace '@[0-9\.]+', '' ";

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };

