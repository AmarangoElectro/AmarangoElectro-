"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type ProtectedSpaceLinkProps = ComponentProps<typeof Link>;

/**
 * Protected ChatGPT Sites navigation.
 *
 * Internal authenticated spaces use Next client navigation instead of the
 * storefront's document-navigation helper so the active Sites session stays
 * within the same preview/origin during normal app use.
 */
export function ProtectedSpaceLink(props: ProtectedSpaceLinkProps) {
  return <Link prefetch={false} {...props} />;
}
