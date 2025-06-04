import chalk from "chalk";

const now = new Date();

type ILevel = "info" | "warn" | "error" | "success" | "debug" | "verbose";
const formattedTime = now
  .toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  .replace(",", "");

const logger = {
  //   verbose: true,

  _formatTimestamp() {
    return chalk.gray(`[${new Date().toLocaleTimeString()}]`);
  },
  _formatError(error: any) {
    if (!error) return "";

    let errorDetails = "";

    return `${error.message} ${errorDetails}`;
  },

  _getLevelStyle(level: ILevel) {
    const styles = {
      info: chalk.blueBright.bold,
      warn: chalk.yellowBright.bold,
      error: chalk.redBright.bold,
      success: chalk.greenBright.bold,
      debug: chalk.magentaBright.bold,
      verbose: chalk.cyan.bold,
    };
    return styles[level] || chalk.white;
  },

  log(level: ILevel, message: string, value = "", error = null) {
    const timestamp = this._formatTimestamp();
    const levelStyle = this._getLevelStyle(level);
    const levelTag = levelStyle(`[${level.toUpperCase()}]`);
    const header = chalk.cyan("◆ HERO");

    let formattedMessage = `${header} ${timestamp} ${levelTag} ${message}`;

    if (value) {
      const formattedValue =
        typeof value === "object" ? JSON.stringify(value) : value;
      const valueStyle =
        level === "error"
          ? chalk.red
          : level === "warn"
          ? chalk.yellow
          : chalk.green;
      formattedMessage += ` ${valueStyle(formattedValue)}`;
    }

    if (error) {
      formattedMessage += `\n${chalk.red(this._formatError(error))}`;
    }

    console.log(formattedMessage);
  },

  info: (message: string, value = "") => logger.log("info", message, value),
  warn: (message: string, value = "") => logger.log("warn", message, value),
  error: (message: string, value = "", error = null) =>
    logger.log("error", message, value, error),
  success: (message: string, value = "") =>
    logger.log("success", message, value),
  debug: (message: string, value = "") => logger.log("debug", message, value),

  verbose: (message: string, value = "") =>
    logger.log("verbose", message, value),

  //   progress(wallet, step, status) {
  //     const progressStyle =
  //       status === "success"
  //         ? chalk.green("✔")
  //         : status === "failed"
  //         ? chalk.red("✘")
  //         : chalk.yellow("➤");

  //     console.log(
  //       chalk.cyan("◆ LayerEdge Auto Bot"),
  //       chalk.gray(`[${new Date().toLocaleTimeString()}]`),
  //       chalk.blueBright(`[PROGRESS]`),
  //       `${progressStyle} ${wallet} - ${step}`
  //     );
  //   },
};

export { formattedTime, logger };
