import classes from './icons.module.css';
export default function Icons(){
  return (
    <div className={classes.icons}>
        <img src="/images/8.svg" id={classes.circle1} className={classes.icon} />
        <img src="/images/9.svg" id={classes.circle2} className={classes.icon} />
    </div>
  );
};
