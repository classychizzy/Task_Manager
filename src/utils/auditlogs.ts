
import { logger } from "../lib/logger";
import { AuditAction } from "../enums/auditActions";

export function auditLog({
  action,
  userId,
  resource,
  resourceId,
  metadata,
}: {
  action: AuditAction;
  userId?: number;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}) {
  logger.info({
    type: "AUDIT",
    action,
    userId,
    resource,
    resourceId,
    metadata,
    timestamp: new Date().toISOString(),
  });
}