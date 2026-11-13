// 徽章常量（§3.4）：目前 v1.0 仅一枚首次下载徽章
export const BADGES = {
  first_download: {
    id: 'first_download',
    name: '首次下载',
    desc: '完成第一款虚构游戏的下载与安装',
  },
};

export function badgeById(id) {
  return BADGES[id] || null;
}
