import * as ftp from "basic-ftp";

export interface FtpAccessOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean | "implicit";
}

export function createFtpClient(settings: Record<string, string>): ftp.Client {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  const timeout = parseInt(settings.ftpTimeout || "30", 10);
  if (timeout > 0) {
    client.ftp.timeout = timeout * 1000;
  }

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
    client.ftp.passive = false;
  } else {
    client.ftp.passive = true;
  }
}