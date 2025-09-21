import Pagination from "./Pagination";

export default function ProblemPanel({
  question,
  questionNumber = 1,
  totalQuestions = 1,
  onQuestionChange
}) {
  if (!question) return <div className="p-4">No question received</div>;

  // ✅ Safe fallback values
  const title = question.title || "Untitled";
  const code = question.code || "// no code";
  const description = question.description || "No description";
  const difficulty = question.difficulty || "unknown";

  return (
    <div className="border-[1.7px] border-zinc-300 dark:border-zinc-700 rounded-lg h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md py-1 border-b border-gray-200 dark:border-zinc-700 rounded-t-lg w-full">
        <h2 className="text-base px-4">Description</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 prose max-w-none space-y-6 text-sm">
        <div>
          <h3 className="text-lg font-semibold">
            Q{questionNumber} - {title}
          </h3>
          <span
            className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-semibold uppercase ${
              difficulty === "easy"
                ? "bg-green-100 text-green-700"
                : difficulty === "medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-700"
            }`}
          >
            {difficulty}
          </span>
        </div>

        {/* Description */}
        <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {description}
        </div>

        {/* Problem Note */}
        <div className="bg-blue-50 dark:text-white dark:bg-blue-900/30 p-4 rounded-md border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-white mb-2">
            Your Task:
          </h4>
          <ol className="list-decimal list-inside space-y-2 dark:text-white text-blue-700">
            <li>Carefully read the description & examine the code block in the editor</li>
            <li>Identify any issues or bugs in code</li>
            <li>Rewrite the code in the editor panel to the right</li>
          </ol>
        </div>

        {/* Additional Notes */}
        <div className="text-sm italic text-zinc-500 dark:text-zinc-400">
          Note: The code above may contain intentional issues or inefficiencies that need to be addressed.
        </div>
      </div>

      {/* Pagination */}
      <div className="w-full py-1 border-t-2 border-gray-300 dark:border-zinc-700">
        <Pagination
          currentQuestion={questionNumber - 1}
          totalQuestions={totalQuestions}
          onQuestionChange={onQuestionChange}
        />
      </div>
    </div>
  );
}