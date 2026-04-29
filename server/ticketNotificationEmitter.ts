import { EventEmitter } from "events";
import { tickets } from "../drizzle/schema";

export interface TicketNotification {
  type: "new_ticket" | "ticket_updated" | "ticket_closed" | "ticket_assigned";
  ticketId: number;
  subject: string;
  priority: string;
  status: string;
  timestamp: Date;
  createdBy?: string;
  assignedTo?: string;
  assignedAgentId?: number;
  assignedAgentName?: string;
}

/**
 * Global event emitter for ticket notifications
 * Used to broadcast real-time updates to connected WebSocket clients
 */
class TicketNotificationEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Allow up to 100 concurrent listeners
  }

  /**
   * Emit a new ticket notification
   */
  notifyNewTicket(ticket: any) {
    const notification: TicketNotification = {
      type: "new_ticket",
      ticketId: ticket.id,
      subject: ticket.subject,
      priority: ticket.priority,
      status: ticket.status,
      timestamp: new Date(),
      createdBy: ticket.createdBy,
      assignedTo: ticket.assignedTo,
    };

    this.emit("ticket:new", notification);
    console.log(`[Ticket Notification] New ticket #${ticket.id}: ${ticket.subject}`);
  }

  /**
   * Emit a ticket update notification
   */
  notifyTicketUpdate(ticket: any, changes: Record<string, any>) {
    const notification: TicketNotification = {
      type: "ticket_updated",
      ticketId: ticket.id,
      subject: ticket.subject,
      priority: ticket.priority,
      status: ticket.status,
      timestamp: new Date(),
      assignedTo: ticket.assignedTo,
    };

    this.emit("ticket:update", { notification, changes });
    console.log(`[Ticket Notification] Ticket #${ticket.id} updated: ${JSON.stringify(changes)}`);
  }

  /**
   * Emit a ticket assigned notification
   */
  notifyTicketAssigned(ticket: any, agentId: number, agentName: string) {
    const notification: TicketNotification = {
      type: "ticket_assigned",
      ticketId: ticket.id,
      subject: ticket.subject,
      priority: ticket.priority,
      status: ticket.status,
      timestamp: new Date(),
      assignedAgentId: agentId,
      assignedAgentName: agentName,
    };

    this.emit("ticket:assigned", { notification, agentId });
    console.log(`[Ticket Notification] Ticket #${ticket.id} assigned to agent ${agentName}`);
  }

  /**
   * Emit a ticket closed notification
   */
  notifyTicketClosed(ticket: any, reason?: string) {
    const notification: TicketNotification = {
      type: "ticket_closed",
      ticketId: ticket.id,
      subject: ticket.subject,
      priority: ticket.priority,
      status: "closed",
      timestamp: new Date(),
      assignedTo: ticket.assignedTo,
    };

    this.emit("ticket:closed", { notification, reason });
    console.log(`[Ticket Notification] Ticket #${ticket.id} closed${reason ? `: ${reason}` : ""}`);
  }

  /**
   * Get all active listeners count
   */
  getListenerCount(): number {
    return this.listenerCount("ticket:new") +
           this.listenerCount("ticket:update") +
           this.listenerCount("ticket:closed");
  }
}

export const ticketNotificationEmitter = new TicketNotificationEmitter();
