import Md5 from 'spark-md5';

function stringMd5(str: string) {
  return Md5.hash(str);
}

export default stringMd5;
