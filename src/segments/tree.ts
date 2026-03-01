/**
 * Tree data structure for parsing graphemes based on orthography profile
 */

import { replace, ErrorHandler } from './errors';

/**
 * Node in the tree data structure
 */
class TreeNode {
  char: string;
  children: Map<string, TreeNode>;
  sentinel: boolean;

  constructor(char: string, sentinel: boolean = false) {
    this.char = char;
    this.children = new Map();
    this.sentinel = sentinel;
  }
}

/**
 * Tree data structure for grapheme parsing
 */
export class Tree {
  private root: TreeNode;

  /**
   * Build a tree from a list of graphemes
   * @param graphemes - Array of grapheme strings to add to the tree
   */
  constructor(graphemes: string[]) {
    this.root = new TreeNode('', true);

    for (const grapheme of graphemes) {
      this.addMultigraph(grapheme);
    }
  }

  /**
   * Add a multigraph to the tree
   * @param line - The grapheme string to add
   */
  private addMultigraph(line: string): void {
    let node = this.root;
    for (const char of line) {
      if (!node.children.has(char)) {
        node.children.set(char, new TreeNode(char));
      }
      node = node.children.get(char)!;
    }
    node.sentinel = true;
  }

  /**
   * Parse a string using the tree structure
   * @param line - String to parse
   * @param error - Error handler function
   * @returns Array of parsed graphemes
   */
  parse(line: string, error: ErrorHandler = replace): string[] {
    let [res, idx] = this._parse(this.root, line, 0);
    let rem = line.substring(idx);

    while (rem.length > 0) {
      // Chop off one character and try parsing the remainder
      res.push(error(rem[0]));
      rem = rem.substring(1);
      const [r, i] = this._parse(this.root, rem, 0);
      res = res.concat(r);
      rem = rem.substring(i);
    }

    return res;
  }

  /**
   * Internal recursive parsing function
   * @param root - Current tree node
   * @param line - String to parse
   * @param idx - Current index in the string
   * @returns Tuple of [parsed graphemes, updated index]
   */
  private _parse(root: TreeNode, line: string, idx: number): [string[], number] {
    // Base case
    if (line.length === 0) {
      return [[], idx];
    }

    let parse: string[] = [];
    let curr = 0;
    let node: TreeNode | undefined = root;
    let cidx = idx;

    while (curr < line.length) {
      node = node.children.get(line[curr]);
      curr++;

      if (!node) {
        break;
      }

      if (node.sentinel) {
        const [subparse, subcidx] = this._parse(root, line.substring(curr), idx + curr);
        // Always keep the latest valid parse, which will be
        // the longest-matched (greedy match) graphemes
        parse = [line.substring(0, curr)].concat(subparse);
        cidx = subcidx;
      }
    }

    if (parse.length > 0) {
      idx = cidx;
    }

    return [parse, idx];
  }
}
