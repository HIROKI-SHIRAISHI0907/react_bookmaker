import { ReactNode } from "react";

/**
 * 管理画面（コンソール型）の1行ツールバー
 *   左: タイトル + 補足情報 / 右: 条件や操作ボタン（children）
 *   description を渡すと、2行目に小さく説明を出す
 */
type Props = {
  title: string;
  info?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export default function ConsoleToolbar({ title, info, description, children, className = "" }: Props) {
  return (
    <div className={["mb-3 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5", className].join(" ")}>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 text-[17px] font-bold text-gray-900">{title}</h1>
        {info != null && <span className="text-xs text-gray-500">{info}</span>}
        {children != null && <div className="ml-auto flex flex-wrap items-center gap-1.5">{children}</div>}
      </div>
      {description != null && <p className="m-0 mt-1.5 text-xs leading-relaxed text-gray-500">{description}</p>}
    </div>
  );
}
