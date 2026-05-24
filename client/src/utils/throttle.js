export function throttle(callback, wait = 300) {
  let lastRun = 0; //记录上一次真正执行 callback 的时间
  let timer = null; //保存当前是否已经有一个延迟任务在排队

  return (...args) => {
    const now = Date.now();
    const remaining = wait - (now - lastRun); //表示距离下次允许执行还剩多少时间

    //已经到时间了，立即执行
    if (remaining <= 0) {
      lastRun = now;
      callback(...args);
      return;
    }

    //还没到时间，但已经有定时器了
    if (timer) {
      return;
    }

    //还没到时间，也没有定时器，那就挂一个延迟执行
    timer = window.setTimeout(() => {
      lastRun = Date.now();
      timer = null;
      callback(...args);
    }, remaining);
  };
}
