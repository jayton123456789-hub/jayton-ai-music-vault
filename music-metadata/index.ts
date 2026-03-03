export type IPicture = {
  data: Uint8Array;
  format: string;
  description?: string;
};

export type IAudioMetadata = {
  common: {
    picture?: IPicture[];
  };
};

function decodeSyncSafeInteger(bytes: Uint8Array) {
  return (
    ((bytes[0] ?? 0) << 21) |
    ((bytes[1] ?? 0) << 14) |
    ((bytes[2] ?? 0) << 7) |
    (bytes[3] ?? 0)
  );
}

function stripUnsynchronisation(bytes: Uint8Array) {
  const values: number[] = [];

  for (let index = 0; index < bytes.length; index += 1) {
    const current = bytes[index];
    const next = bytes[index + 1];

    values.push(current);

    if (current === 0xff && next === 0x00) {
      index += 1;
    }
  }

  return Uint8Array.from(values);
}

function decodeText(bytes: Uint8Array) {
  if (!bytes.length) {
    return "";
  }

  const encoding = bytes[0];
  const body = bytes.subarray(1);

  if (encoding === 1 || encoding === 2) {
    const decoder = new TextDecoder("utf-16");
    return decoder.decode(body).replace(/\0/g, "").trim();
  }

  if (encoding === 3) {
    return new TextDecoder("utf-8").decode(body).replace(/\0/g, "").trim();
  }

  return new TextDecoder("latin1").decode(body).replace(/\0/g, "").trim();
}

function findStringTerminator(bytes: Uint8Array, encoding: number, start: number) {
  if (encoding === 1 || encoding === 2) {
    for (let index = start; index < bytes.length - 1; index += 2) {
      if (bytes[index] === 0 && bytes[index + 1] === 0) {
        return index;
      }
    }

    return bytes.length;
  }

  const index = bytes.indexOf(0, start);
  return index === -1 ? bytes.length : index;
}

function parseApicFrame(frameBytes: Uint8Array) {
  if (frameBytes.length < 4) {
    return null;
  }

  const encoding = frameBytes[0];
  let cursor = 1;
  const mimeEnd = frameBytes.indexOf(0, cursor);

  if (mimeEnd === -1) {
    return null;
  }

  const format = new TextDecoder("latin1").decode(frameBytes.subarray(cursor, mimeEnd)).trim();
  cursor = mimeEnd + 1;

  if (cursor >= frameBytes.length) {
    return null;
  }

  cursor += 1;
  const descriptionEnd = findStringTerminator(frameBytes, encoding, cursor);
  const descriptionBytes = frameBytes.subarray(cursor, descriptionEnd);
  const description = descriptionBytes.length
    ? decodeText(Uint8Array.of(encoding, ...descriptionBytes))
    : "";
  cursor =
    descriptionEnd + (encoding === 1 || encoding === 2 ? 2 : 1);

  if (cursor >= frameBytes.length) {
    return null;
  }

  return {
    data: frameBytes.subarray(cursor),
    format: format || "image/jpeg",
    description
  };
}

function parseId3Pictures(buffer: Uint8Array) {
  if (buffer.length < 10) {
    return [];
  }

  if (
    buffer[0] !== 0x49 ||
    buffer[1] !== 0x44 ||
    buffer[2] !== 0x33
  ) {
    return [];
  }

  const flags = buffer[5] ?? 0;
  const tagSize = decodeSyncSafeInteger(buffer.subarray(6, 10));
  let cursor = 10;

  if ((flags & 0x40) === 0x40 && buffer.length >= 14) {
    const extendedHeaderSize = decodeSyncSafeInteger(buffer.subarray(10, 14));
    cursor += extendedHeaderSize;
  }

  const tagEnd = Math.min(buffer.length, 10 + tagSize);
  const pictures: IPicture[] = [];

  while (cursor + 10 <= tagEnd) {
    const header = buffer.subarray(cursor, cursor + 10);
    const frameId = new TextDecoder("latin1").decode(header.subarray(0, 4));

    if (!frameId.trim()) {
      break;
    }

    const frameSize =
      (header[4] << 24) |
      (header[5] << 16) |
      (header[6] << 8) |
      header[7];

    if (!frameSize || cursor + 10 + frameSize > tagEnd) {
      break;
    }

    const rawFrame = buffer.subarray(cursor + 10, cursor + 10 + frameSize);
    const frameBytes = (flags & 0x80) === 0x80 ? stripUnsynchronisation(rawFrame) : rawFrame;

    if (frameId === "APIC") {
      const picture = parseApicFrame(frameBytes);

      if (picture?.data.length) {
        pictures.push(picture);
      }
    }

    cursor += 10 + frameSize;
  }

  return pictures;
}

export async function parseBuffer(
  input: Uint8Array | ArrayBuffer
): Promise<IAudioMetadata> {
  const buffer = input instanceof ArrayBuffer ? new Uint8Array(input) : input;

  return {
    common: {
      picture: parseId3Pictures(buffer)
    }
  };
}
