export interface ConversationLine {
  role: string;
  content: string;
}

export class Conversation {
  lines: ConversationLine[];

  constructor(lines: ConversationLine[] = []) {
    this.lines = lines;
  }

  toJson(): string {
    return JSON.stringify({ lines: this.lines });
  }

  getLines(): ConversationLine[] {
    return this.lines.map(line => ({ role: line.role, content: line.content }));
  }

  printConversation(): void {
    for (const line of this.lines) {
      console.log(`${line.role}: ${line.content}\n`);
    }
  }
}
