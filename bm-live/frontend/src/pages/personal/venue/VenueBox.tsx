// スタジアムの地理情報の表示（試合詳細・チームページで共通）
//  地図は OpenStreetMap の埋め込み（API キー不要）。Google マップへのリンク（place_id 付き）
import { ExternalLink, MapPin } from "lucide-react";
import type { MatchVenue } from "../../../api/match/matchtypes";

/** OpenStreetMap の埋め込み地図 URL。座標の周り約 1.5km 四方 */
export function osmEmbedUrl(lat: number, lng: number): string {
  const dLat = 0.007;
  const dLng = 0.01;
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].map((x) => x.toFixed(6)).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

type Props = {
  v: MatchVenue;
  /** マスタにスタジアム名が無いときに出す名前（試合ページの表記など） */
  fallbackName?: string | null;
  /** HOME_TEAM で一致したときに「試合会場と異なる場合があります」を出すか（試合詳細: true / チームページ: false） */
  showHomeTeamNote?: boolean;
};

export default function VenueBox({ v, fallbackName = null, showHomeTeamNote = true }: Props) {
  const lat = v.latitude != null ? Number(v.latitude) : null;
  const lng = v.longitude != null ? Number(v.longitude) : null;
  const hasCoord = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const name = v.stadiumName ?? fallbackName ?? "-";
  const city = [v.homeCity, v.country].filter(Boolean).join("・");

  return (
    <div className="space-y-2 text-[12px]">
      <div>
        <div className="flex items-start gap-1.5 font-bold">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span className="min-w-0 break-words">{name}</span>
        </div>
        {v.stadiumNameEn && v.stadiumNameEn !== name && <div className="ml-5 text-[11px] text-muted-foreground">{v.stadiumNameEn}</div>}
        {city && <div className="ml-5 text-[11px] text-muted-foreground">{city}</div>}
      </div>

      {showHomeTeamNote && v.matchedBy === "HOME_TEAM" && (
        <div className="rounded-md bg-amber-500/10 px-2 py-1 text-[10px] text-amber-700 dark:text-amber-300">
          {v.teamName ?? "ホームチーム"} のホームスタジアムです（中立地開催などで試合会場と異なる場合があります）
        </div>
      )}

      {hasCoord ? (
        <div className="overflow-hidden rounded-lg border">
          <iframe
            title={`${name} の地図`}
            src={osmEmbedUrl(lat as number, lng as number)}
            className="block h-44 w-full"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-3 text-center text-[11px] text-muted-foreground">位置情報が登録されていません</div>
      )}

      {v.address && <div className="break-words text-[11px] text-muted-foreground">{v.address}</div>}

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {v.mapUrl ? (
          <a href={v.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            Googleマップで開く
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span />
        )}
        {hasCoord && (
          <span className="font-mono text-[10px] text-muted-foreground">
            {(lat as number).toFixed(4)}, {(lng as number).toFixed(4)}
          </span>
        )}
      </div>
      {hasCoord && <div className="text-[9px] text-muted-foreground">地図 © OpenStreetMap contributors</div>}
    </div>
  );
}
