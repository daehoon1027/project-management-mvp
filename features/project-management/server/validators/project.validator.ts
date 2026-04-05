export function validateProjectName(name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("프로젝트 이름을 입력해 주세요.");
  }

  return normalizedName;
}

