/**
 * Task utility functions for getPosts scene
 */

import { ITaskLink } from "../../../../../utils/interfaces";

/**
 * Generate file content for task
 */
export function generateTaskFileContent(
  username: string,
  taskNumber: number,
  links: ITaskLink[],
  minimumLinksForTask?: number
): string {
  let content = ``;
  links.forEach((link) => {
    content += `${link.postUrl}\n`;
  });
  return content;
}
