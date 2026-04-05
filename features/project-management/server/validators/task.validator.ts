export function validateTaskTitle(title: string) {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    throw new Error("Task 제목을 입력해 주세요.");
  }

  return normalizedTitle;
}

