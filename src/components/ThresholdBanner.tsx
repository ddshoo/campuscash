import Link from "next/link";

type Props = {
  balance: number;
  threshold: number;
};

export function ThresholdBanner({ balance, threshold }: Props) {
  if (balance >= threshold) return null;

  return (
    <Link href="/balance/alerts">
      <div className="bg-orange/10 border border-orange rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-orange text-lg">⚠️</span>
          <div>
            <p className="text-orange text-sm font-semibold">Low Balance Alert</p>
            <p className="text-orange/80 text-xs">
              Balance is below your{" "}
              {threshold.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}{" "}
              threshold
            </p>
          </div>
        </div>
        <span className="text-orange text-sm">›</span>
      </div>
    </Link>
  );
}
