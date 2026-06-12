const migrations = [
  {
    id: "001_initial_team_optimizer_schema",
    statements: [
      `create table if not exists employees (
        id serial primary key,
        name text not null,
        role text not null,
        load integer not null check (load >= 0 and load <= 100),
        skill integer not null check (skill >= 1 and skill <= 5),
        created_at timestamp with time zone not null default now()
      )`,
      `create table if not exists recommendations (
        id serial primary key,
        project_name text not null,
        project_description text,
        required_role text,
        team_size integer not null check (team_size >= 1 and team_size <= 20),
        member_names jsonb not null,
        explanation text not null,
        ai_powered boolean not null,
        created_at timestamp with time zone not null default now()
      )`,
      `alter table recommendations add column if not exists project_description text`,
      `alter table recommendations add column if not exists required_role text`,
      `create index if not exists employees_name_idx on employees (lower(name), id)`,
      `create index if not exists employees_role_idx on employees (lower(role), id)`,
      `create index if not exists recommendations_created_at_idx on recommendations (created_at desc, id desc)`,
    ],
  },
];

module.exports = { migrations };