// 徽章常量（§3.4 / 批次 6 扩展）
// 全部条件均可由本地状态直接判定，不依赖时间、网络或随机数（可测试）
export const BADGES = {
  first_download: {
    id: 'first_download',
    name: '首次下载',
    desc: '完成第一款虚构游戏的下载与安装',
    cond: '完成任意一款游戏的下载与安装',
    icon: '🏆',
  },
  first_launch: {
    id: 'first_launch',
    name: '初次启动',
    desc: '第一次点击「开始游戏」',
    cond: '启动任意一款已安装的游戏',
    icon: '▶️',
  },
  shelf_three: {
    id: 'shelf_three',
    name: '小有收藏',
    desc: '库中拥有三款游戏',
    cond: '让 3 款游戏进入你的库',
    icon: '📚',
  },
  shelf_all: {
    id: 'shelf_all',
    name: '架上无空',
    desc: '把目录里的作品全部收入库中',
    cond: '集齐当前目录的全部作品（数量随目录增长）',
    icon: '🗃️',
  },
  first_reveal: {
    id: 'first_reveal',
    name: '揭开封面',
    desc: '完成首次体验揭示',
    cond: '第一次走完「安装完成」后的揭示页',
    icon: '🎁',
  },
  first_gift: {
    id: 'first_gift',
    name: '心意初赠',
    desc: '第一次给作者送心意',
    cond: '向任意一款游戏送出一次心意',
    icon: '💝',
  },
  launch_ten: {
    id: 'launch_ten',
    name: '老玩家',
    desc: '累计启动十次',
    cond: '累计点击「开始游戏」10 次',
    icon: '⏱️',
  },
  survey_done: {
    id: 'survey_done',
    name: '如实作答',
    desc: '提交体验反馈问卷',
    cond: '完成并提交一次体验反馈',
    icon: '📝',
  },
};

// 展示顺序：先易后难，徽章墙按此排列
export const BADGE_ORDER = [
  'first_download', 'first_launch', 'first_reveal', 'first_gift',
  'shelf_three', 'launch_ten', 'survey_done', 'shelf_all',
];

export const BADGE_LIST = BADGE_ORDER.map(id => BADGES[id]);

export function badgeById(id) {
  return BADGES[id] || null;
}
