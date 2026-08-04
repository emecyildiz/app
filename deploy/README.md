# Ratemet VPS deployment

This stack is independent from the portfolio stack. It only shares the external Docker network used by Cloudflare Tunnel. The portfolio repository does not need to be edited.

## One-time VPS preparation

1. Create the deployment and secret directories:

   ```bash
   sudo install -d -m 0755 /opt/emecworks/ratemet
   sudo install -d -m 0700 /etc/emecworks /var/backups/emecworks/ratemet
   ```

2. Clone this repository into `/opt/emecworks/ratemet`.
3. Copy `env.production.example` to `/etc/emecworks/ratemet.env`, replace every placeholder, and protect it:

   ```bash
   sudo chmod 600 /etc/emecworks/ratemet.env
   ```

4. Confirm that the shared tunnel network exists:

   ```bash
   docker network inspect emecworks-edge >/dev/null 2>&1 || docker network create emecworks-edge
   ```

## Deploy or update

Run from `/opt/emecworks/ratemet`:

```bash
git pull --ff-only
docker compose --env-file /etc/emecworks/ratemet.env -f docker-compose.prod.yml build --pull
docker compose --env-file /etc/emecworks/ratemet.env -f docker-compose.prod.yml up -d
docker compose --env-file /etc/emecworks/ratemet.env -f docker-compose.prod.yml ps
curl --fail http://127.0.0.1:8091/health
```

The API runs its idempotent SQL migrations before starting. PostgreSQL and the API are not published on a host port. The web gateway is exposed only on VPS loopback for diagnostics and on `emecworks-edge` for Cloudflare Tunnel.

## Cloudflare Tunnel route

Create a published application route with:

- Hostname: `ratemet.emecworks.com`
- Service URL: `http://ratemet-gateway:8080`

Do not add Cloudflare Access authentication to this public application. The app has its own user accounts. Keep the VPS firewall closed to public ports other than those required by the existing host administration design.

## Backup and restore

Install the backup script and its systemd units:

```bash
sudo install -m 0750 deploy/ratemet-backup.sh /usr/local/sbin/ratemet-backup
sudo install -m 0644 deploy/ratemet-backup.service /etc/systemd/system/ratemet-backup.service
sudo install -m 0644 deploy/ratemet-backup.timer /etc/systemd/system/ratemet-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now ratemet-backup.timer
```

The default destination is `/var/backups/emecworks/ratemet` and the default retention is 14 days. The timer runs daily at 02:40 UTC with a randomized delay of up to 30 minutes.

Test a backup manually:

```bash
sudo /usr/local/sbin/ratemet-backup
```

Restore into an empty Ratemet database during a maintenance window:

```bash
docker compose --env-file /etc/emecworks/ratemet.env -f docker-compose.prod.yml stop api
docker compose --env-file /etc/emecworks/ratemet.env -f docker-compose.prod.yml exec -T db \
  pg_restore -U ratemet -d ratemet --clean --if-exists --no-owner --no-acl < /path/to/ratemet.dump
docker compose --env-file /etc/emecworks/ratemet.env -f docker-compose.prod.yml start api
```

Copy backups to the encrypted off-server backup destination already used for Emecworks. A backup that exists only on the VPS is not sufficient.

## Retirement of hosted services

Do not delete the old Supabase, Vercel, or Render resources until all of the following are true:

1. A final export has been retained.
2. Required application data has been imported or a deliberate clean-start decision has been recorded.
3. Registration, login, email verification, password reset, movie data, and social features pass production smoke tests.
4. A database backup has been created and restored successfully in a disposable database.
5. The old deployment remains available for a short rollback window.
