import * as ftp from "basic-ftp";

export interface FtpAccessOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean | "implicit";
}

export function createFtpClient(settings: Record<string, string>): ftp.Client {
  const timeout = parseInt(settings.ftpTimeout || "30", 10);
  const client = new ftp.Client(timeout > 0 ? timeout * 1000 : undefined);
  client.ftp.verbose = false;

  return client;
}

export function getFtpAccessOptions(settings: Record<string, string>): FtpAccessOptions {
  const secure = settings.ftpSecure;
  let secureOption: boolean | "implicit" = false;
  if (secure === "implicit") {
    secureOption = "implicit";
  } else if (secure === "explicit") {
    secureOption = true;
  }

  return {
    host: (settings.ftpHost || "").trim(),
    port: parseInt(settings.ftpPort || "21", 10),
    user: (settings.ftpUser || "").trim(),
    password: (settings.ftpPass || "").trim(),
    secure: secureOption,
  };
}

export function setFtpTransferMode(client: ftp.Client, settings: Record<string, string>): void {
  const mode = settings.ftpMode || "passive";
  if (mode === "active") {
    // basic-ftp uses passive mode by default; active mode is set via internal flag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client.ftp as any).passive = false;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client.ftp as any).passive = true;
  }
}