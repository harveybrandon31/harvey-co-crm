"use client";

import Link from "next/link";
import { PendingIntakeReview } from "@/lib/analytics/queries";

interface PendingIntakeReviewsProps {
  reviews: PendingIntakeReview[];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFilingStatus(status: string | null): string {
  if (!status) return "Unknown";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function PendingIntakeReviews({ reviews }: PendingIntakeReviewsProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="mt-2 text-sm">All intakes have been reviewed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <Link
          key={review.id}
          href={`/dashboard/clients/${review.id}`}
          className="block p-4 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 truncate">
                  {review.firstName} {review.lastName}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-200 text-amber-800">
                  New
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600 space-y-0.5">
                {review.email && (
                  <p className="truncate">{review.email}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{formatFilingStatus(review.filingStatus)}</span>
                  {review.hasDependents && (
                    <span>{review.dependentCount} dependent{review.dependentCount !== 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0 text-right">
              <span className="text-xs text-gray-500">
                {formatTimeAgo(review.intakeCompletedAt)}
              </span>
              <div className="mt-1">
                <span className="inline-flex items-center text-xs text-brand-primary font-medium">
                  Review
                  <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
