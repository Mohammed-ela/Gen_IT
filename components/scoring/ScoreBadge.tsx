import { getScoreCategory } from "@/lib/scoring";

interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
}

export default function ScoreBadge({ score, size = "md" }: Props) {
  const cat = getScoreCategory(score);

  const dim = {
    sm: "w-9 h-9 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-16 h-16 text-xl",
  }[size];

  return (
    <div
      className={`${dim} rounded-lg flex flex-col items-center justify-center flex-shrink-0 border font-mono font-bold`}
      style={{
        backgroundColor: cat.bg,
        borderColor: cat.border,
        color: cat.color,
      }}
      title={`Score : ${score}/100`}
    >
      {score}
      {size === "lg" && (
        <span className="text-[9px] font-sans font-normal mt-0.5 opacity-70">
          {cat.label}
        </span>
      )}
    </div>
  );
}
