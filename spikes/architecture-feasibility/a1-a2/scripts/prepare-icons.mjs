import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const icons = {
  "icon-16.png": "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAOklEQVR4nGP8H278n4ECwESJZqoYwILCW3GGeJ0RJtRxAcUGMOKMBWzegTqbqi4YNWAwGIA7HdDLBQBvawu4NOFuKQAAAABJRU5ErkJggg==",
  "icon-32.png": "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAXUlEQVR4nGP8H278n2EAAdNAWj7qgFEHMDAwMLDglFlxhvq2RZhgCA14CIw6YNQBjGTXBdhyCZZUTggMeAiMOmDUAaMOGHXAqANGHTDgDiC/OqYSGPAQGHXAgDsAAENlC9hA2wcyAAAAAElFTkSuQmCC",
  "icon-48.png": "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAfklEQVR4nO3YwQ2AIBQEUTF2pL1oiRZjT9gBakQnm8y7woHJPxAodZ3rEGykD/CWATQDaAbQ4gOmW7v24+NjNGxLczl+AgbQDKAZQIsPKN1fZHcuvYvL6Yn4CRhAM4BmAM0AmgE0A2gG0AygGUAzgNb/V+Jn8RMwgGYAzQDaCebBC/g/cedqAAAAAElFTkSuQmCC",
  "icon-128.png": "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABdklEQVR4nO3dwQ3DIBAAwThKR04vcYkpxj05LeSDkdiZAoDH6l4ItuuzXw+ynrMPwFwCiBNAnADiBBAngDgBxAkgTgBxAogTQJwA4gQQJ4A4AcQJIE4AcQKIE0CcAOIEECeAOAHECSDudcsu3/OWbZZ0vIcubwLECSBOAHECiBNAnADiBBAngDgBxAkgTgBxAogTQJwA4gQQJ4A4AcQJIE4AcQKIE0Dctuxz8SNuIg++oTuDCRAngDgBxAkgTgBxAogTQJwA4gQQJ4A4AcQJIE4AcQKIE0CcAOIEECeAOAHECSBOAHECiBNAnADiBBAngDgBxAkgTgBxAogTQJwA4gQQJ4A4AcQJIE4AcQKIE0CcAOIEECeAOAHECSBOAHECiBNAnADiBBAngDgTQJwA4gQQJ4A4AcQJIE4AcQKIE0CcAOIEECeAOAHECSBOAHECiBNAnADiBBAngDgBxP0AYQkMmOG2wQsAAAAASUVORK5CYII="
};

for (const extension of ["extension-readonly", "extension-permission-sensitive"]) {
  const publicDirectory = join(process.cwd(), "apps", extension, "public");
  await mkdir(publicDirectory, { recursive: true });
  for (const [filename, base64] of Object.entries(icons)) {
    await writeFile(join(publicDirectory, filename), Buffer.from(base64, "base64"));
  }
}
