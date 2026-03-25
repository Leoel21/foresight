// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ForesightMarket {

    address public owner;
    address public usdtToken;
    uint256 public platformFee = 2;  // 2%
    uint256 public creatorFee  = 1;  // 1%

    enum Side { YES, NO }
    enum Status { OPEN, CLOSED, RESOLVED }

    struct Market {
        string  question;
        address creator;
        uint256 poolYes;
        uint256 poolNo;
        uint256 closesAt;
        Status  status;
        Side    result;
        bool    resultSet;
    }

    struct Prediction {
        Side    side;
        uint256 amount;
        bool    claimed;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Prediction)) public predictions;

    event MarketCreated(uint256 indexed id, string question, address creator, uint256 closesAt);
    event PredictionPlaced(uint256 indexed marketId, address indexed user, Side side, uint256 amount);
    event MarketResolved(uint256 indexed marketId, Side result);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el owner");
        _;
    }

    constructor(address _usdtToken) {
        owner     = msg.sender;
        usdtToken = _usdtToken;
    }

    // ─── CREAR MERCADO ───────────────────────────────────────
    function createMarket(string calldata question, uint256 closesAt) external returns (uint256) {
        require(closesAt > block.timestamp, "Fecha de cierre en el pasado");
        require(bytes(question).length > 0, "Pregunta vacia");

        // Deposito de 1 USDT del creador
        uint256 deposit = 1 * 10**6; // USDT tiene 6 decimales
        require(
            IERC20(usdtToken).transferFrom(msg.sender, address(this), deposit),
            "Fallo deposito creador"
        );

        uint256 id = marketCount++;
        markets[id] = Market({
            question:  question,
            creator:   msg.sender,
            poolYes:   0,
            poolNo:    0,
            closesAt:  closesAt,
            status:    Status.OPEN,
            result:    Side.YES,
            resultSet: false
        });

        emit MarketCreated(id, question, msg.sender, closesAt);
        return id;
    }

    // ─── APOSTAR ─────────────────────────────────────────────
    function predict(uint256 marketId, Side side, uint256 amount) external {
        Market storage m = markets[marketId];
        require(m.status == Status.OPEN, "Mercado no abierto");
        require(block.timestamp < m.closesAt, "Mercado cerrado");
        require(amount >= 1 * 10**5, "Minimo 0.1 USDT");
        require(amount <= 10 * 10**6, "Maximo 10 USDT");
        require(predictions[marketId][msg.sender].amount == 0, "Ya apostaste");

        require(
            IERC20(usdtToken).transferFrom(msg.sender, address(this), amount),
            "Fallo transferencia"
        );

        predictions[marketId][msg.sender] = Prediction({ side: side, amount: amount, claimed: false });

        if (side == Side.YES) m.poolYes += amount;
        else                  m.poolNo  += amount;

        emit PredictionPlaced(marketId, msg.sender, side, amount);
    }

    // ─── RESOLVER MERCADO (solo owner) ───────────────────────
    function resolveMarket(uint256 marketId, Side result) external onlyOwner {
        Market storage m = markets[marketId];
        require(m.status == Status.OPEN, "Mercado ya resuelto");
        // Owner puede resolver antes del cierre en casos especiales
if (msg.sender != owner) {
    require(block.timestamp >= m.closesAt, "Mercado aun abierto");
}

        m.status    = Status.RESOLVED;
        m.result    = result;
        m.resultSet = true;

        uint256 totalPool  = m.poolYes + m.poolNo;
        uint256 platformCut = (totalPool * platformFee) / 100;
        uint256 creatorCut  = (totalPool * creatorFee)  / 100;

        // Enviar fees
        if (platformCut > 0) IERC20(usdtToken).transfer(owner, platformCut);
        if (creatorCut  > 0) IERC20(usdtToken).transfer(m.creator, creatorCut);

        emit MarketResolved(marketId, result);
    }

    // ─── RECLAMAR GANANCIAS ───────────────────────────────────
    function claimWinnings(uint256 marketId) external {
        Market storage m = markets[marketId];
        require(m.resultSet, "Mercado no resuelto");

        Prediction storage p = predictions[marketId][msg.sender];
        require(p.amount > 0,  "No apostaste");
        require(!p.claimed,    "Ya reclamaste");
        require(p.side == m.result, "No ganaste");

        p.claimed = true;

        uint256 totalPool    = m.poolYes + m.poolNo;
        uint256 netPool      = totalPool - (totalPool * (platformFee + creatorFee)) / 100;
        uint256 winningSide  = m.result == Side.YES ? m.poolYes : m.poolNo;
        uint256 payout       = (p.amount * netPool) / winningSide;

        require(IERC20(usdtToken).transfer(msg.sender, payout), "Fallo pago");

        emit WinningsClaimed(marketId, msg.sender, payout);
    }

    // ─── REEMBOLSO si nadie del otro lado ────────────────────
    function claimRefund(uint256 marketId) external {
        Market storage m = markets[marketId];
        require(m.resultSet, "Mercado no resuelto");

        
        uint256 losingSide  = m.result == Side.YES ? m.poolNo  : m.poolYes;

        // Si no hubo perdedores, devolver a todos
        require(losingSide == 0, "Hay perdedores, usa claimWinnings");

        Prediction storage p = predictions[marketId][msg.sender];
        require(p.amount > 0, "No apostaste");
        require(!p.claimed,   "Ya reclamaste");

        p.claimed = true;
        require(IERC20(usdtToken).transfer(msg.sender, p.amount), "Fallo reembolso");
    }

    // ─── VISTAS ──────────────────────────────────────────────
    function getMarket(uint256 marketId) external view returns (
        string memory question,
        address creator,
        uint256 poolYes,
        uint256 poolNo,
        uint256 closesAt,
        uint8   status,
        bool    resultSet,
        uint8   result
    ) {
        Market storage m = markets[marketId];
        return (m.question, m.creator, m.poolYes, m.poolNo, m.closesAt, uint8(m.status), m.resultSet, uint8(m.result));
    }

    function getPrediction(uint256 marketId, address user) external view returns (
        uint8   side,
        uint256 amount,
        bool    claimed
    ) {
        Prediction storage p = predictions[marketId][user];
        return (uint8(p.side), p.amount, p.claimed);
    }
}