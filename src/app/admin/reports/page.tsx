import Link from "next/link";
import type { Metadata } from "next";
import { Flag, Inbox, MailOpen } from "lucide-react";
import type { ReportStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  adminResolveReportAction,
  adminMarkEnquiryHandledAction,
} from "@/app/actions/admin-actions";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/badges";
import { reportReasonLabel } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { param, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reports & enquiries" };

const OUTCOMES = [
  { value: "REVIEWING", label: "Keep under review" },
  { value: "RESOLVED", label: "Resolve (action taken)" },
  { value: "DISMISSED", label: "Dismiss (no action)" },
];

const DONE_MESSAGES: Record<string, string> = {
  updated: "Report updated.",
  enquiry: "Enquiry marked as handled.",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const done = param(sp.done);
  const status = param(sp.status) ?? "OPEN";

  const where: { status?: ReportStatus } =
    status === "ALL" ? {} : { status: status as ReportStatus };

  const [reports, openCount, reviewingCount, enquiries] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        listing: { select: { id: true, title: true, status: true } },
        reportedUser: { select: { id: true, name: true, email: true, suspended: true } },
        reporter: { select: { name: true, email: true } },
      },
    }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.report.count({ where: { status: "REVIEWING" } }),
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const FILTERS = [
    { value: "OPEN", label: "Open" },
    { value: "REVIEWING", label: "Reviewing" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "DISMISSED", label: "Dismissed" },
    { value: "ALL", label: "All" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Reports &amp; enquiries</h1>
        <p className="section-subtitle">
          {openCount} open report{openCount === 1 ? "" : "s"} · {reviewingCount}{" "}
          under review · {enquiries.filter((e) => !e.handled).length} unanswered
          enquiries.
        </p>
      </div>

      {done && DONE_MESSAGES[done] && (
        <p className="rounded-2xl border border-forest-200 bg-forest-50 px-5 py-4 text-sm font-medium text-forest-900">
          {DONE_MESSAGES[done]}
        </p>
      )}

      {/* ------------------------------- Reports -------------------------------- */}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/reports?status=${f.value}`}
            className={cn(
              "badge border px-3 py-1.5 transition",
              status === f.value
                ? "border-forest-700 bg-forest-700 text-white"
                : "border-sand-300 bg-white text-ink-700 hover:border-forest-400"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No reports here"
          description="Nothing matches this filter — the community is behaving."
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={report.status} />
                  <span className="badge bg-sand-200 text-ink-800">
                    {reportReasonLabel(report.reason)}
                  </span>
                </div>
                <p className="text-xs text-ink-400">
                  {formatDateTime(report.createdAt)}
                </p>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink-700">
                {report.details}
              </p>

              <div className="mt-4 grid gap-3 text-xs text-ink-500 sm:grid-cols-3">
                <div>
                  <p className="font-semibold uppercase tracking-wide text-ink-400">
                    Reported item
                  </p>
                  {report.listing ? (
                    <Link
                      href={`/product/${report.listing.id}`}
                      className="font-medium text-forest-700 hover:underline"
                    >
                      {report.listing.title}
                    </Link>
                  ) : (
                    <p>No listing (removed)</p>
                  )}
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wide text-ink-400">
                    Reported user
                  </p>
                  {report.reportedUser ? (
                    <p>
                      <span className="font-medium text-ink-800">
                        {report.reportedUser.name}
                      </span>{" "}
                      ({report.reportedUser.email})
                      {report.reportedUser.suspended && (
                        <span className="ml-1 font-semibold text-red-600">
                          — suspended
                        </span>
                      )}
                    </p>
                  ) : (
                    <p>No specific user</p>
                  )}
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wide text-ink-400">
                    Filed by
                  </p>
                  {report.reporter ? (
                    <p>
                      {report.reporter.name} ({report.reporter.email})
                    </p>
                  ) : report.reporterEmail ? (
                    <p>
                      {report.reporterName ?? "Guest"} ({report.reporterEmail})
                    </p>
                  ) : (
                    <p>Guest, no contact details</p>
                  )}
                </div>
              </div>

              {report.resolutionNote && (
                <p className="mt-3 rounded-xl bg-sand-100 px-4 py-2.5 text-xs text-ink-700">
                  <span className="font-semibold">Moderator note:</span>{" "}
                  {report.resolutionNote}
                </p>
              )}

              {/* Resolution controls */}
              <form
                action={adminResolveReportAction}
                className="mt-4 flex flex-col gap-2 border-t border-sand-100 pt-4 sm:flex-row"
              >
                <input type="hidden" name="id" value={report.id} />
                <select
                  name="outcome"
                  defaultValue="RESOLVED"
                  className="input text-sm sm:w-56"
                >
                  {OUTCOMES.map((outcome) => (
                    <option key={outcome.value} value={outcome.value}>
                      {outcome.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="note"
                  placeholder="What did you do about it? (internal note)"
                  maxLength={500}
                  className="input flex-1 text-sm"
                />
                <button type="submit" className="btn-primary btn-sm shrink-0">
                  Update report
                </button>
              </form>
              <p className="mt-2 text-[11px] text-ink-400">
                To act on the listing itself, use the moderation tools in{" "}
                <Link
                  href="/admin/listings"
                  className="font-medium text-forest-700 hover:underline"
                >
                  Listings
                </Link>
                .
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------ Enquiries ------------------------------- */}

      <div className="card p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <Inbox className="h-5 w-5 text-forest-600" aria-hidden="true" />
          Contact enquiries
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Messages sent from the public Contact &amp; Help page.
        </p>
        {enquiries.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-8 text-center text-sm text-ink-500">
            No enquiries yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-sand-100">
            {enquiries.map((enquiry) => (
              <li key={enquiry.id} className="flex flex-col gap-2 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">
                      {enquiry.subject}
                      {enquiry.handled && (
                        <span className="badge ml-2 bg-forest-100 text-forest-800">
                          handled
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-500">
                      {enquiry.name} &lt;{enquiry.email}&gt; ·{" "}
                      {formatDateTime(enquiry.createdAt)}
                    </p>
                  </div>
                  {!enquiry.handled && (
                    <form action={adminMarkEnquiryHandledAction}>
                      <input type="hidden" name="id" value={enquiry.id} />
                      <button type="submit" className="btn-secondary btn-sm shrink-0">
                        <MailOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        Mark handled
                      </button>
                    </form>
                  )}
                </div>
                <p className="rounded-xl bg-sand-50 px-4 py-3 text-sm leading-relaxed text-ink-700">
                  {enquiry.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
