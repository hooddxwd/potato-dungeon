#!/bin/bash
export PATH="/root/.nvm/versions/node/v22.22.0/bin:$PATH"
cd /root/potato-dungeon/frontend
rm -f .next/dev/lock
export PORT=10010
npm run dev
