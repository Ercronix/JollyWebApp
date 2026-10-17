# Deployment

Every push to `main` that passes CI is deployed to the production server by the `deploy` job in
`.github/workflows/ci.yml`. The job runs on a self-hosted GitHub Actions runner on the server. The
runner connects out to GitHub, so the server needs no open ports.

The job runs in the existing checkout on the server (it keeps `.env` and `backups/` there):

1. `git fetch origin main` and `git merge --ff-only <commit>`. The job fails if the checkout is not on
   `main` or has local commits, rather than discarding them.
2. `docker compose up -d --build --remove-orphans --wait`, which waits until the backend and MongoDB
   report healthy (the job fails after 5 minutes otherwise).
3. `docker image prune -f`, so rebuilt images don't fill the disk.

Deploys are listed under the repository's **Actions** tab and under **Deployments** (`production`).

## One-time setup

### 1. Repository settings

- **Settings → Secrets and variables → Actions → Variables**: add `DEPLOY_DIR` with the absolute path
  of the checkout on the server (the directory with `docker-compose.yml` and `.env`).
- **Settings → Actions → General → Approval for running fork pull request workflows**: choose
  *Require approval for all external contributors*. The repository is public, and a pull request
  from a fork can edit the workflow to target the self-hosted runner. Never approve a fork's run
  without reading its workflow changes.

### 2. Runner on the server

Run the runner as the user who owns the checkout. That user must be in the `docker` group (which is
equivalent to root on that machine) and must be able to `git fetch` from GitHub (HTTPS works for a
public repository).

1. On GitHub, open **Settings → Actions → Runners → New self-hosted runner**, choose Linux and your
   architecture, and follow the download commands it shows (into e.g. `~/actions-runner`).
2. Configure it with the label the job asks for:
   ```bash
   ./config.sh --url https://github.com/Ercronix/JollyWebApp --token <token from that page> \
     --name jolly-server --labels jolly-deploy --unattended
   ```
3. Install and start it as a service, so it survives reboots:
   ```bash
   sudo ./svc.sh install "$USER"
   sudo ./svc.sh start
   ```
4. Check that it shows as *Idle* under **Settings → Actions → Runners**.

### 3. Check the checkout

```bash
cd "$DEPLOY_DIR"
git status        # on branch main, nothing to commit
git fetch origin  # works without a password prompt
```

The next push to `main` deploys. To redeploy without a new commit, re-run the latest CI run on `main`.

## Troubleshooting

- **The deploy job waits forever with "Waiting for a runner"**: the runner is offline. Check
  `sudo ./svc.sh status` in the runner directory.
- **`Not possible to fast-forward`**: the server's checkout has local commits or is on another branch.
  Fix it by hand, then re-run the job.
- **`--wait` times out**: a container is unhealthy. See `docker compose ps` and `docker compose logs backend`
  in `DEPLOY_DIR`. The previous containers are already replaced at that point, so fix forward or check
  out the last good commit and run `docker compose up -d --build`.
