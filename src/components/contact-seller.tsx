"use client";

import { useState } from "react";
import { MessageCircle, Phone, ShieldCheck } from "lucide-react";

import { Modal } from "@/components/modal";
import { SAFETY_ACKNOWLEDGEMENT } from "@/lib/constants";

/**
 * Contact-seller flow with the mandatory safety acknowledgement.
 * Buyers must acknowledge the safety notice before WhatsApp/phone details
 * are revealed. Contact options honour the seller's preferred method.
 */
export function ContactSeller({
  sellerName,
  sellerPhone,
  listingTitle,
  price,
  preferredContact,
  status,
}: {
  sellerName: string;
  sellerPhone: string;
  listingTitle: string;
  price: string;
  preferredContact: string;
  status: string;
}) {
  const [open, setOpen] = useState(false);
  const [acked, setAcked] = useState(false);

  const showWhatsApp = preferredContact === "ANY" || preferredContact === "WHATSAPP";
  const showCall = preferredContact === "ANY" || preferredContact === "PHONE";

  const waMessage = encodeURIComponent(
    `Hi ${sellerName.split(" ")[0]}, I saw your "${listingTitle}" listing (${price}) on Sokoni Nyumbani. Is it still available?`
  );
  const waHref = `https://wa.me/${sellerPhone}?text=${waMessage}`;
  const callHref = `tel:+${sellerPhone}`;

  const soldOrReserved = status === "SOLD" || status === "RESERVED";

  return (
    <>
      <button
        onClick={() => {
          setAcked(false);
          setOpen(true);
        }}
        className="btn-primary btn-lg w-full"
        disabled={status === "SOLD"}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        {status === "SOLD" ? "Listing sold" : "Contact seller"}
      </button>
      {status === "RESERVED" && (
        <p className="mt-2 text-center text-xs text-ink-500">
          This item is currently reserved — you can still enquire.
        </p>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Contact ${sellerName.split(" ")[0]}`}
      >
        <div className="rounded-xl border border-sand-200 bg-sand-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-gold-700"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-ink-900">
                Stay safe when buying
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-ink-600">
                <li>Inspect the item physically before paying whenever possible.</li>
                <li>Never send money before verifying the item and seller.</li>
                <li>Meet in safe, public or mutually agreed locations.</li>
                <li>Verify payment confirmations independently — screenshots are not proof.</li>
              </ul>
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-gold-300 bg-gold-50 p-3 text-sm text-ink-800">
            <input
              type="checkbox"
              checked={acked}
              onChange={(e) => setAcked(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-forest-700"
              required
            />
            <span>{SAFETY_ACKNOWLEDGEMENT}</span>
          </label>
        </div>

        <div className="mt-5 space-y-3">
          {!acked && (
            <p className="text-center text-xs text-ink-500">
              Tick the acknowledgement above to reveal contact options.
            </p>
          )}
          {acked && showWhatsApp && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-lg w-full"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Chat on WhatsApp
            </a>
          )}
          {acked && showCall && (
            <a href={callHref} className="btn-secondary btn-lg w-full">
              <Phone className="h-5 w-5" aria-hidden="true" />
              Call seller
            </a>
          )}
          {acked && soldOrReserved && (
            <p className="text-center text-xs text-ink-500">
              Note: this listing is {status.toLowerCase()}.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
