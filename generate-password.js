import bcrypt from 'bcrypt';

// 生成密码哈希
async function generatePasswordHash(password) {
  const saltRounds = 10;
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
    return hash;
  } catch (error) {
    console.error('Error generating hash:', error);
    return null;
  }
}

// 生成admin1917的密码哈希
generatePasswordHash('admin1917');