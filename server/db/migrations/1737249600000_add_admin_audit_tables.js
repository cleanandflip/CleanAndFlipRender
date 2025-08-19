export const up = (pgm) => {
  // Create admin checkpoints table
  pgm.createTable("admin_checkpoints", {
    id: "id",
    label: { type: "text", notNull: true },
    created_by: { type: "text", notNull: true },
    created_at: { type: "timestamptz", default: pgm.func("now()") },
    branch: { 
      type: "text", 
      notNull: true, 
      check: "branch in ('dev','prod')" 
    },
    strategy: { type: "text", notNull: true }, // 'branch' | 'dump'
    reference: { type: "text", notNull: true }, // branch name or dump key
    notes: { type: "text" },
  });

  // Create admin actions audit table
  pgm.createTable("admin_actions", {
    id: "id",
    actor_id: { type: "text" },
    action: { type: "text", notNull: true },
    details: { type: "jsonb", notNull: true, default: "{}" },
    created_at: { type: "timestamptz", default: pgm.func("now()") },
  });

  // Create indexes for better performance
  pgm.createIndex("admin_checkpoints", "branch");
  pgm.createIndex("admin_checkpoints", "created_at");
  pgm.createIndex("admin_actions", "action");
  pgm.createIndex("admin_actions", "created_at");
  pgm.createIndex("admin_actions", "actor_id");
};

export const down = (pgm) => {
  pgm.dropTable("admin_actions");
  pgm.dropTable("admin_checkpoints");
};