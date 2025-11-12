import Account, { associate as associateAccount } from './account';
import Alarm, { associate as associateAlarm } from './alarm';
import AlarmSetting, { associate as associateAlarmSetting } from './alarmSetting';
import Authority, { associate as associateAuthority } from './authority';
import Ban, { associate as associateBan } from './ban';
import Benifit, { associate as associateBenifit } from './benifit';
import Card, { associate as associateCard } from './card';
import Chat, { associate as associateChat } from './chat';
import Comment, { associate as associateComment } from './comment';
import CommentChild, { associate as associateCommentChild } from './commentChild';
import Container, { associate as associateContainer } from './container';
import CreatorAuth, { associate as associateCreatorAuth } from './creatorAuth';
import Declaration, { associate as associateDeclaration } from './declaration';
import CallHistory, { associate as associateCallHistory } from './callHistory';
import Exchange, { associate as associateExchange } from './exchange';
import FanStep, { associate as associateFanStep } from './fanStep';
import Follow, { associate as associateFollow } from './follow';
import Item, { associate as associateItem } from './item';
import Money, { associate as associateMoney } from './money';
import Payment, { associate as associatePayment } from './payment';
import Point, { associate as associatePoint } from './point';
import PointHistory, { associate as associatePointHistory } from './pointHistory';
import Post, { associate as associatePost } from './post';
import Rank, { associate as associateRank } from './rank';
import Room, { associate as associateRoom } from './room';
import Score, { associate as associateScore } from './score';
import SocialLogin, { associate as associateSocialLogin } from './socialLogin';
import Subscribe, { associate as associateSubscribe } from './subscribe';
import UserRoom, { associate as associateUserRoom } from './userRoom';
import User, { associate as associateUser } from './user';
import Wish, { associate as associateWish } from './wish';
import Block, { associate as associateBlock } from './block';
import Mcn, { associate as associateMcn } from './mcn'
import Donation, { associate as associateDonation } from './donation';
import Info, { associate as associateInfo } from './info';
import InAppRefund, { associate as associateInAppRefund } from './inAppRefund';
import PartnerExchange, { associate as associatePartnerExchange } from './partnerExchange';
import Earn, { associate as associateEarn } from './earn';
import AdsCount, { associate as associateAdsCount } from './adsCount';
import LastScreen, { associate as associateLastScreen } from './lastScreen';

export * from './sequelize';
export {
  Account,
  Alarm,
  AlarmSetting,
  Authority,
  Ban,
  Benifit,
  Chat,
  Comment,
  CommentChild,
  Exchange,
  CallHistory,
  Card,
  Container,
  CreatorAuth,
  Declaration,
  FanStep,
  Follow,
  Item, Money,
  Payment,
  Point,
  PointHistory,
  Post,
  Rank,
  Room,
  Subscribe,
  Score,
  SocialLogin,
  UserRoom,
  User,
  Wish,
  Block, Mcn, Donation,
  Info,
  InAppRefund, PartnerExchange,
  Earn,
  AdsCount,
  LastScreen
}
const db = {
  Account,
  Alarm,
  AlarmSetting,
  Authority,
  Ban,
  Benifit,
  Chat,
  Comment,
  CommentChild,
  Exchange,
  CallHistory,
  Card,
  Container,
  CreatorAuth,
  Declaration,
  FanStep,
  Follow,
  Item, Money,
  Payment,
  Point,
  PointHistory,
  Post,
  Rank,
  Room,
  Subscribe,
  Score,
  SocialLogin,
  UserRoom,
  User,
  Wish,
  Block, Mcn, Donation,
  Info,
  InAppRefund, PartnerExchange,
  Earn,
  AdsCount,
  LastScreen
};

export type dbType = typeof db;

associateAccount(db)
associateAlarm(db)
associateAlarmSetting(db)
associateAuthority(db)
associateBan(db)
associateBenifit(db)
associateChat(db)
associateCard(db)
associateCreatorAuth(db)
associateComment(db)
associateCommentChild(db)
associateExchange(db)
associateCallHistory(db)
associateContainer(db)
associateDeclaration(db)
associateFanStep(db)
associateFollow(db)
associateItem(db)
associateMoney(db)
associatePayment(db)
associatePoint(db)
associatePoint(db)
associatePointHistory(db)
associatePost(db)
associateRank(db)
associateRank(db)
associateRoom(db)
associateScore(db)
associateSocialLogin(db)
associateSubscribe(db)
associateUserRoom(db)
associateUser(db)
associateWish(db)
associateBlock(db)
associateMcn(db)
associateDonation(db)
associateInfo(db)
associateInAppRefund(db)
associatePartnerExchange(db)
associateEarn(db)
associateAdsCount(db)
associateLastScreen(db)