import { FileSystem } from "./File";
import { window, OutputChannel, commands, ExtensionContext } from "vscode";
import { chmodSync } from "fs";

export class Executables {
  /**
   * the path of lsp executable
   */
  public static async getLSP(
    context: ExtensionContext,
    version: string
  ): Promise<string> {
    let lspPath = "flux-lsp";
    if (process.platform==="win32"){
      lspPath=lspPath+".exe";
    }
    const globalStatePath = context.globalStoragePath;
    const lspPathExtension = globalStatePath + "/" + lspPath;

    let lspExe = await FileSystem.findExecutablePath(lspPath);
    let lspExe2 = await FileSystem.findExecutablePath(lspPathExtension);
    if (!lspExe && !lspExe2) {
      console.log("can't find the lsp");
      lspPath = lspPathExtension;
      FileSystem.doesDirExist(globalStatePath).then(existed => {
        if (!existed) {
          FileSystem.createDir(globalStatePath).then(success => {
            if (!success) {
              console.log("failed to create globalStateDir", globalStatePath);
              window.showErrorMessage("Unable install language server");
              return "error";
            }
          });
        }
      });

      let installed = await this.promoteInstall(
        "flux language server",
        this.DownloadLSP,
        version,
        lspPath
      );
      if (!installed) {
        window.showErrorMessage("Unable install language server");
        return "error";
      }
      commands.executeCommand("workbench.action.reloadWindow");
    } else if (lspExe2) {
      lspPath = lspPathExtension;
    }
    return lspPath;
  }

  /**
   * the path of influx cli executable
   */
  public static async getInfluxCLI(): Promise<string | undefined> {
    return FileSystem.findExecutablePath("influx");
  }

  private static async promoteInstall(
    tool: string,
    intall: (v: string, p: string) => Promise<boolean>,
    version: string,
    lspPath: string
  ): Promise<boolean> {
    const option = { title: "Install" };
    let msg = await window
      .showInformationMessage("You are missing the " + tool, option)
      .then(async selection => {
        if (selection !== option) {
          return false;
        }
        let installed = await intall(version, lspPath);
        if (installed) {
          return true;
        }
      });
    if (!msg) {
      return false;
    }
    return msg;
  }

  private static async doDownloadLSP(
    outputChannel: OutputChannel,
    release: string,
    lspPath: string
  ): Promise<boolean> {
    let out = await FileSystem.downloadFile(release, lspPath);
    if (out) {
      chmodSync(lspPath, "0755");
      console.log("downloaded to ",lspPath);
      outputChannel.dispose();
      return true;
    }
    outputChannel.appendLine("error downloading " + release);
    return false;
  }

  private static async DownloadLSP(
    version: string,
    lspPath: string
  ): Promise<boolean> {
    let outputChannel = window.createOutputChannel("Influx tools installation");
    outputChannel.show(true);
    let cmd: string;
    switch (process.platform) {
      case "darwin":
        return Executables.doDownloadLSP(
          outputChannel,
          "https://github.com/influxdata/flux-lsp/releases/download/" +
            version +
            "/flux-lsp-macos",
          lspPath
        );
      case "linux":
        return Executables.doDownloadLSP(
          outputChannel,
          "https://github.com/influxdata/flux-lsp/releases/download/" +
            version +
            "/flux-lsp-linux",
          lspPath
        );
      case "win32":
        return Executables.doDownloadLSP(
          outputChannel,
          "https://github.com/influxdata/flux-lsp/releases/download/" +
            version +
            "/flux-lsp.exe",
          lspPath
        );
      default:
        console.log(
          "This is not a supported OS, please see https://github.com/influxdata/flux-lsp for debug mode"
        );
        break;
    }
    return false;
  }
}
