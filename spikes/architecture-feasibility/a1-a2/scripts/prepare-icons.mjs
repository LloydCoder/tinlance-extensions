import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const sourceDirectory = join(
  process.cwd(),
  "..",
  "..",
  "..",
  "assets",
  "brand",
  "tinlance-extensions",
  "png"
);

for (const extension of ["extension-readonly", "extension-permission-sensitive"]) {
  const publicDirectory = join(process.cwd(), "apps", extension, "public");
  await mkdir(publicDirectory, { recursive: true });
  for (const filename of ["icon-16.png", "icon-32.png", "icon-48.png"]) {
    await copyFile(join(sourceDirectory, filename), join(publicDirectory, filename));
  }
}
